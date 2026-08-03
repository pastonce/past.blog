> * `Adapter`称为适配器，**可以对现有的`Container`、`Iterator`和`Functor`进行小幅度的改造或修饰，且不会改变部件类型**，一般是以**内含**（而非继承）的方式使用他们的原有功能

## Container Adapter

此种适配器一般是对原有的容器施加独特的约束或特性，使其变化为一种新的容器，但**几乎所有操作都是调用原容器的方法**来实现的。例如：

* [[STL 7] | Adapter-1-队列Queue及栈Stack](https://past-blog.vercel.app/blog/Adapter-queue-stack) 适配了`Deque`
* [[STL 9] | Adapter-2-集合Set/Multiset及映射Map/Multimap](https://past-blog.vercel.app/blog/Adapter-set-map) 适配了`Rb_tree`
* [[STL 11] | Adapter-3-无序集合Unordered_set/multiset及无序映射Unordered_map/multimap](https://past-blog.vercel.app/blog/Adapter-unordered-set-map) 适配了`Hashtable`

## Functor Adapter

**`Functor Adapter`本身也必须是一个`Functor`**，因此它也要对`()`运算符进行重载；如果要求适配性，那么也需要继承`unary_function`或`binary_function`两个结构体之一。以下展示了几个具体示例来说明此类适配器的具体实现方式：

### bind2nd

该适配器的作用是**将双参数类型的`Functor`的第二个模板参数绑定为指定值**，类似的还有`bind1st`适配器，其在 GCC2.9 中的实现如下：

```c++
template <class Operation, class T>
inline binder2nd<Operation> bind2nd(const Operation& op, const T& x) {
    typedef typename Operation::second_argument_type arg2_type;
    return binder2nd<Operation>(op, arg2_type(x));
}
template <class Operation> 
class binder2nd: public unary_function<typename Operation::first_argument_type,
                        typename Operation::result_type> {
protected:
    Operation op;
    typename Operation::second_argument_type value;
public:
    binder2nd(const Operation& x, const typename Operation::second_argument_type& y) 
        : op(x), value(y) {}
    typename Operation::result_type
    operator()(const typename Operation::first_argument_type& x) const
    { return op(x, value); }
};
```

* `line 2`的第一个参数为双参数类型的`Functor`，第二个参数为要绑定的指定值，传入的`Functor`的类型**由函数模板自动推导**为`Operation`
* 如果传入的`Functor`继承了`binary_function`结构体，那么它就会提供关于`first/second_argument_type`以及`result_type`的定义，便于`Adapter`进行适配，详见[[STL 14] | Functor-基本结构及可适配性](https://past-blog.vercel.app/blog/Functor-basic-adaptive)
* `line 13-14`的构造函数保证了`line 4`创建类对象的正确性，`line 15-17`的`()`运算符重载方法以及对原`Functor`的调用实现了绑定功能
* 如果传入的`Functor`不符合要求（如为单参数类型）或要绑定的值类型不匹配，则会在`line 4`处报错
* **`typename`关键字用于指示编译器某个标识符应被视为类型，特别地，引用一个依赖于模板参数的嵌套类型必需要在前面使用`typename`**

### not1

该适配器的作用是**将`Functor`的返回结果进行逻辑取反**，其在 GCC2.9 中的实现如下：

```c++
template <class Predicate>
inline unary_negate<Predicate> not1(const Predicate& pred) {
    return unary_negate<Predicate>(pred);
}
template <class Predicate>
class unary_negate: public unary_function<typename Predicate::argument_type, bool> {
protected:
    Predicate pred;
public:
    explicit unary_negate(const Predicate& x) : pred(x) {}
    bool operator()(const typename Predicate::argument_type& x) const
    { return !pred(x); }
};
```

* 同样，传入的`Functor`的类型由函数模板自动推导为`Predicate`，适配后的`Functor`依然对`unary_function`结构体进行继承
* `line 12`在调用原`Functor`的基础上进行取反，实现了适配器的主要功能

### 新型适配器bind

`bind`是 C++ 11 之后支持的新型适配器，可以替代`bind1st/bind2nd`使用，有以下功能：

* 可以绑定函数或仿函数的参数
* 可以绑定结构体或类的成员函数
* 可以绑定结构体或类的数据成员

```c++
using namespace std::placeholders;

double my_divide(double x, double y)
	{ return x / y; }
struct MyPair {
    double a, b;
    double multiply() { return a * b; }
    // 所有成员函数的第一个参数默认为 this
};
// 绑定函数参数
auto fn_five = bind(my_divide, 10, 2);
cout << fn_five() << '\n'; // 5
auto fn_half = bind(my_divide, _1, 2);
cout << fn_half(10) << '\n'; // 5
auto fn_invert = bind(my_divide, _2, _1);
cout << fn_invert(10, 2) << '\n'; // 0.2
auto fn_rounding = bind<int>(my_divide, _1, _2);
cout << fn_rounding(10, 3) << '\n'; // 3
// 绑定结构体或类的成员函数和数据成员
MyPair ten_two {10, 2};
auto bound_memfn = bind(&MyPair::multiply, _1);
cout << bound_memfn(ten_two) << '\n'; // 20
auto bound_memdata = bind(&MyPair::a, ten_two);
cout << bound_memdata() << '\n'; // 10
auto bound_memdata2 = bind(&MyPair::b, _1);
cout << bound_memdata2(ten_two) << '\n'; // 2
// 绑定仿函数参数
vector<int> v {15, 37, 94, 50, 73, 58, 28, 98};
cout << count_if(v.cbegin(), v.cend(), bind2nd(less<int>(), 50)) << endl;
cout << count_if(v.cbegin(), v.cend(), bind(less<int>(), _1, 50)) << endl;
```

* `bind`需结合`std::placeholders`命名空间使用，其提供了形如`_1/_2/_3...`的占位符对象，**主要作用是指定函数参数的位置**，从而实现参数绑定、重排序或延迟传递
* 如`line 17-18`所示，**`bind`支持传入一个模板参数，用于指定返回类型**
* 对比`line 21-26`可知，对结构体或类的绑定，**第一个参数均为对象实例**，不绑定则在调用时需传入

## Iterator Adapter

`Iterator Adapter`本身也是一个`iterator`，因此也需要拥有五个相关类型，对`++/--/*/->`等操作符进行重载的实现。以下展示了几个特殊的迭代器来说明此类适配器的具体实现方式：

### reverse_iterator

许多容器在提供正常`iterator`的同时还支持`reverse_iterator`，其作用方式和代码实现如下所示：

![](/blogs/Adapter-three-categories/d6041bc654e42809.png)

```c++
reverse_iterator rbegin()
{ return reverse_iterator(end()); }
reverse_iterator rend()
{ return reverse_iterator(begin()); }
```

其中，`rbegin()`与`rend()`就是两个`reverse_iterator`，由于顺序反转，这些迭代器的**内容应为其左方的元素**，且**正向移动是从右到左移动**；从代码中可以看到，**`rbegin()`由`end()`适配得到，`rend()`由`begin()`适配得到**

```c++
template <class Iterator>
class reverse_iterator {
protected:
    Iterator current;
public:
    typedef typename iterator_traits<Iterator>::iterator_category iterator_category;
    typedef typename iterator_traits<Iterator>::value_type value_type;
    typedef typename iterator_traits<Iterator>::difference_type difference_type;
    typedef typename iterator_traits<Iterator>::pointer pointer;
    typedef typename iterator_traits<Iterator>::reference reference;

    typedef Iterator iterator_type;
    typedef reverse_iterator<Iterator> self;
public:
    reverse_iterator() {}
    explicit reverse_iterator(iterator_type x) : current(x) {}
    reverse_iterator(const self& x) : current(x.current) {}
    
    iterator_type base() const { return current; }
    reference operator*() const {
        Iterator tmp = current;
        return *--tmp;
    }
    pointer operator->() const { return &(operator*()); }

    self& operator++() { // 前置++
        --current;
        return *this;
    }
    self operator++(int) { // 后置++
        self tmp = *this;
        --current;
        return tmp;
    }
    self& operator--()  // 前置--
        ++current;
        return *this;
    }
    self operator--(int) { // 后置--
        self tmp = *this;
        ++current;
        return tmp;
    }

    self operator+(difference_type n) const {
        return self(current - n);
    }
    self& operator+=(difference_type n) {
        current -= n;
        return *this;
    }
    self operator-(difference_type n) const {
        return self(current + n);
    }
    self& operator-=(difference_type n) {
        current += n;
        return *this;
    }
    reference operator[](difference_type n) const { return *(*this + n); }  
}; 
```

* `line 4`保存了传入的`iterator`，以便在改造后的方法中进行调用
* `line 6-10`指定了适配后的`iterator`的五个相关类型，`line 15-17`的构造函数将传入的`iterator`赋值到数据成员中
* `line 20-23`表示反转的迭代器取值后是相应正常迭代器指向的前一个元素，`line 26-58`实现了方向相反的移动

### inserter



### ostream_iterator



### istream_iterator