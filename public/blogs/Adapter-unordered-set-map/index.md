> * **C++ 11 之后**，`Hash_(multi)set/(multi)map`均更名为`Unordered_(multi)set/(multi)map`
> * `Hash_set/multiset`和`Hash_map/multimap`均以`Hashtable`为底层结构，它们的几乎所有的操作，都通过调用底层`Hashtable`的操作来实现，因此它们**也可以说是一种容器适配器**
> * 与`Set/Map`不同的是，**`Hash_set/map`中的元素并不能自动排序**，即对`iterator`进行遍历得到的序列是无序的（unordered）

## Hash_set/multiset-GCC2.9

`Hash_set/multiset`的构建需要传入四个模板参数（下面以`Hash_set`为例）：

```c++
template <class Value, class HashFcn = hash<Value>,
          class EqualKey = equal_to<Value>,
          class Alloc = alloc>
class hash_set {
private:
    typedef hashtable<Value, Value, HashFcn, identity<Value>,
            EqualKey, Alloc> ht;
    ht rep; // 底层 hashtable
public:
    typedef typename ht::key_type key_type;
    typedef typename ht::value_type value_type;
    typedef typename ht::hasher hasher;
    typedef typename ht::key_equal key_equal;
    
    typedef typename ht::size_type size_type;
    typedef typename ht::difference_type difference_type;
    typedef typename ht::const_pointer pointer;
    typedef typename ht::const_reference reference;
    typedef typename ht::const_iterator iterator;
    ...
    hasher hash_funct() const { return rep.hash_funct(); }
    key_equal key_eq() const { return rep.key_eq(); }
public:
    hash_set() : rep(100, hasher(), key_equal()) {}
    explicit hash_set(size_type n) : rep(n, hasher(), key_equal()) {}
    hash_set(size_type n, const hasher& hf) : rep(n, hf, key_equal()) {}
    hash_set(size_type n, const hasher& hf, const key_equal& eql) : rep(n, hf, eql) {}

    size_type size() const { return rep.size(); }
    size_type max_size() const { return rep.max_size(); }
    bool empty() const { return rep.empty(); }
    void swap(hash_set& hs) { rep.swap(hs.rep); }
    
    iterator begin() const { return rep.begin(); }
    iterator end() const { return rep.end(); }
    ...
    pair<iterator, bool> insert(const value_type& obj) { // 使用 insert_unique
        pair<typename ht::iterator, bool> p = rep.insert_unique(obj);
        return pair<iterator, bool>(p.first, p.second);
    }
    iterator find(const key_type& key) const { return rep.find(key); }
    size_type count(const key_type& key) const { return rep.count(key); }
    size_type erase(const key_type& key) {return rep.erase(key); }
    ...
    void clear() { rep.clear(); }
    void resize(size_type hint) { rep.resize(hint); }
    size_type bucket_count() const { return rep.bucket_count(); }
    size_type max_bucket_count() const { return rep.max_bucket_count(); }
    size_type elems_in_bucket(size_type n) const
    { return rep.elems_in_bucket(n); }
};
```

* 可以看到`Hash_set`的重要数据元素是哈希表`rep`，由于**内部键值合一**，`line 6`自动配置了`Key`和`ExtractKey`两项模板参数；`line 29-50`的方法基本都是通过调用`rep`的方法实现的
* `iterator`几个相关类型也都继承自哈希表类型`ht`，值得注意的是**`pointer/reference/iterator`使用的都是哈希表的常量类型**，这是为了禁止通过`iterator`等变量对其中的值（同时也是键）进行直接修改
* `line 24-27`是四个不同的构造函数，可以看到**默认使用 100 个`bucket`（会被调整为接近的质数 193）**构建哈希表
* `Hash_set`的元素不可重复，因此调用哈希表中的`insert_unique`插入元素；而`Hash_multiset`允许重复，则调用哈希表中的`insert_equal`插入元素

## Hash_map/multimap-GCC2.9

`Hash_map/multimap`中**元素的键值不合一**，因此其构建需要传入五个模板参数（下面以`Hash_map`为例）：

```c++
template <class Key, class T, class HashFcn, class EqualKey, 
          class Alloc = alloc>
class hash_map {
private:
    typedef hashtable<pair<const Key, T>, Key, HashFcn,
            select1st<pair<const Key, T> >, EqualKey, Alloc> ht;
    ht rep; // 底层 hashtable
public:
    typedef typename ht::key_type key_type;
    typedef T data_type;
    typedef T mapped_type;
    typedef typename ht::value_type value_type;
    typedef typename ht::hasher hasher;
    typedef typename ht::key_equal key_equal;

    typedef typename ht::size_type size_type;
    typedef typename ht::difference_type difference_type;
    typedef typename ht::pointer pointer;
    typedef typename ht::reference reference;
    typedef typename ht::iterator iterator;
    ...
    hasher hash_funct() const { return rep.hash_funct(); }
    key_equal key_eq() const { return rep.key_eq(); }
public:
    hash_map() : rep(100, hasher(), key_equal()) {}
    explicit hash_map(size_type n) : rep(n, hasher(), key_equal()) {}
    hash_map(size_type n, const hasher& hf) : rep(n, hf, key_equal()) {}
    hash_map(size_type n, const hasher& hf, const key_equal& eql) : rep(n, hf, eql) {}
    ... // 其余方法实现均和Hash_set基本一致
    T& operator[](const key_type& key) {
        return rep.find_or_insert(value_type(key, T())).second;
    }
    ...
};
```

* 可以看到`Hash_map`的重要数据元素也是哈希表`rep`，但`line 5`将键值组合起来并自动配置了`select1st`仿函数（详见[[STL 9] | Adapter-2-集合Set/Multiset及映射Map/Multimap](https://past-blog.vercel.app/blog/Adapter-set-map)）作为构建`Hashtable`的模板参数
* `line 16-20`的相关类型以及`iterator`不再使用`Hashtable`的常量类型，因为**键值对中的值应当可以被修改**；但元素的键仍不能被直接修改，所以`line 5`传入的`pair`中使用了**`const Key`**
* `Hash_map`的元素不可重复，因此调用哈希表中的`insert_unique`插入元素；而`Hash_multimap`允许重复，则调用哈希表中的`insert_equal`插入元素
* 与`Hash_set`不同的是，`Hash_map`还对`[]`操作符进行了重载，使其**能够在键对应的元素不存在时执行插入操作**，但`Multimap`不支持