> * `Queue`为队列，两端开口，遵循**先进先出**的存取原则
> * `Stack`为栈，一端开口，遵循**先进后出**的存取原则

可以发现`Queue`和`Stack`的特性都可以通过底层容器`Deque`（详见[[STL 6] | Container-4-双向队列Deque](https://past-blog.vercel.app/blog/Container-deque)）稍加限制来实现，`C++ STL`同样是这么实现的，因此**通常不把`Queue`和`Stack`称为容器，而是归为容器的适配器`Adapter`**

![](/blogs/Adapter-queue-stack/ab2620e40e230c8c.png)

## Queue-GCC2.9

```c++
template <typename T, typename Sequence = deque<T>>
class queue {
...
public:
    typedef typename Sequence::value_type value_type;
    typedef typename Sequence::size_type size_type;
    typedef typename Sequence::reference reference;
    typedef typename Sequence::const_reference const_reference;
protected:
    Sequence c;
public:
    bool empty() const { return c.empty(); }
    size_type size() const { return c.size(); }
    reerence front() { return c.front(); }
    const_reference front() const { return c.front(); }
    reference back() { return c.back(); }
    const_reference back() const { c.back(); }
    void push(const value_type& x) { c.push_back(); }
    void pop() { c.pop_front(); }
};
```

* `line 18-19`通过调用底层容器`c`的接口实现了`Queue`的尾进头出、先进先出的特性

## Stack-GCC2.9

```c++
template <typename T, typename Sequence = deque<T>>
class stack {
...
public:
    typedef typename Sequence::value_type value_type;
    typedef typename Sequence::size_type size_type;
    typedef typename Sequence::reference reference;
    typedef typename Sequence::const_reference const_reference;
protected:
    Sequence c;
public:
    bool empty() const { return c.empty(); }
    size_type size() const { return c.size(); }
    reerence top() { return c.back(); }
    const_reference top() const { return c.back(); }
    void push(const value_type& x) { c.push_back(); }
    void pop() { c.pop_back(); }
};
```

* `line 16-17`通过调用底层容器`c`的接口实现了`Stack`的尾进尾出、先进后出的特性

## 注意事项

* `Queue`和`Stack`的实现并非固定使用`Deque`作为底层容器，而是将其作为默认的模板参数（**运行效率最高**）

    * 通过传入第二个模板参数，也可以改变两者使用的底层容器，前提是**所选容器必须能提供对应被调用的接口**

    * | `Sequence` |                `Queue`                |              `Stack`               |
        | :--------: | :-----------------------------------: | :--------------------------------: |
        |   `List`   |                   √                   |                 √                  |
        |  `Deque`   |                   √                   |                 √                  |
        |  `Vector`  |         ×，无`pop_front`接口          |                 √                  |
        |   `Set`    | ×，无`fornt/back/push_back/pop_front` | ×，无`back/push_back/pop_back`接口 |
        |   `Map`    |           缺少`key`无法构造           |         缺少`key`无法构造          |

        由于**模板中的代码仅在实际调用时才会被编译器真正创建**，因此上述`×`只有在使用到不存在的接口时才会触发报错

* **`Queue`和`Stack`都不允许遍历，也不提供相应的`iterator`**，因为它们的数据存取是有限制的，不能在任意位置插入或修改









