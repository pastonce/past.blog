> * Vector是一个可以成长的数组，但无法原地扩充，一般是两倍成长然后全体转移（MSVC是1.5倍成长）

## 基础实现-GCC2.9

![](/blogs/Container-vector/3848326d37ffcb56.png)

`Vector`的主要元素为三个指针，因此**至少占用 12 字节空间**（32-bit系统）：

* `start`：指向容器第一个元素的开始
* `finish`：指向容器**最后一个存储元素**的下一个位置的开始（前闭后开区间）
* `end_of_storage`：指向容器**已开辟空间**的下一个位置的开始

该容器的基础实现部分如下：

```c++
template <typename T, typename Alloc = alloc>
class Vector {
public:
    typedef T value_type;
    typedef value_type* iterator;
    typedef value_type& reference;
    typedef size_t size_type;
protected:
    iterator start;
    iterator finish;
    iterator end_of_storage;
public:
    iterator begin() { return start; }
    iterator end() { return finish; }
    size_type size() { return size_type(end() - begin()); }
    size_type capacity() { reuturn end_of_storage - begin(); }
    bool empty() const { return begin() == end(); }
    reference operator[](size_type n) {
        return *(begin() + n);
    }
    reference front() { return *begin(); }
    reference back() { return *(end() - 1); }
};
```

* 连续存储的容器一般会提供`[]`运算符的重载，注意到此处的实现没有边界检查

* 调用示例：（`iterator_traits`详见[[STL 3] | Iterator-1-相关类型及Iterator Traits](https://past-blog.vercel.app/blog/Iterator-traits)）

    ```c++
    vector<int> vec;
    vector<int>::iterator ite = vec.begin();
    // 调用 vector's iterator 的相关类型
    iterator_traits<ite>::iterator_category
    iterator_traits<ite>::diffenence_type
    iterator_traits<ite>::value_type
    ```

## 成长（reallocation）-GCC2.9

`Vector`的成倍增长是在检测到空间不足时分配一个两倍大的空间，并**将所有元素转移到新空间位置**，代码实现如下：

```c++
void push_back(const T& x) {
    if (finish != end_of_storage) {
        construct(finish, x); // 在 finish 的位置添加元素 x
        ++finish;
    }
    else
        insert_aux(end(), x);
}
```

* 对于`Vector`来说，**只有在增加元素时才会触发空间不足**，因此在`push_back`函数中判断并调用**通用函数**`insert_aux`进行成长的处理

```c++
template <typename T, typename Alloc>
void vector<T, Alloc>::insert_aux(iterator position, const T& x) {
    if (finish != end_of_storage) { // 还有空间
        construct(finish, *(finish - 1));
        ++finish;
        T x_copy = x;
        copy_backward(position, finish - 2, finish - 1); 
        *position = x_copy;
    }
    else { // 空间不足进行成长
        const size_type old_size = size();
        const size_type len = old_size != 0 ? 2 * old_size : 1;
        iterator new_start = data_allocator::allocate(len);
        iterator new_finish = new_start;
        try {
            new_finish = uninitialized_copy(start, position, new_start);
            construct(new_finish, x);
            ++new_finish;
            new_finish = uninitialized_copy(position, finish, new_finish);
        }
        catch(...) {
            destroy(new_start, new_finish);
            data_allocator::deallocate(new_start, len);
            throw;
        }
        destroy(begin(), end());
        deallocate();
        start = new_start;
        finish = new_finish;
        end_of_storage = new_start + len;
    }
}
```

* 需要成长时，`line 11-14`重新申请了2倍原空间大小的内存
* `line 15-20`会将原有内容拷贝到新的空间位置，`line 21-25`则是在捕获到错误时对新容器进行析构并释放申请的内存
* `line 3-9`再次判断空间是否不足以及`line 19`将新元素位置后的原内容也加以拷贝，这是因为`insert_aux`函数也可能被其他容器或算法调用（如`insert`）
* 成长成功后，`line 26-30`对原容器进行析构，释放原空间内存，并初始化新的三个指针

## GCC4.9

GCC4.9 版本的`Vector`实现在功能上几乎一致，继承关系稍复杂一些，如图：

![](/blogs/Container-vector/e133c8d469cd4786.png)

* 主要元素依然是三个指针，因此**同样至少占用 12 字节空间**（32-bit系统）
* `_Vector_impl`继承`allocator`主要是借用了其中定义的一些变量（如`__alloc_traits`中的`pointer`）和功能

